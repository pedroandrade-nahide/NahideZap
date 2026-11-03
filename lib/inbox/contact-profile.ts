/**
 * Contact profile sync (nome do WhatsApp no Inbox)
 *
 * A Meta manda o nome do perfil do cliente junto de cada mensagem recebida,
 * no bloco `contacts` do webhook. O sistema nunca lia esse bloco, então a
 * tabela `contacts` ficava sem nome e o Inbox mostrava só o telefone.
 *
 * Este módulo garante que exista um contato para o telefone e que ele tenha
 * o nome do perfil, antes da mensagem ser gravada.
 *
 * Regras:
 * - Nunca sobrescreve um nome que já existe. Se alguém editou o contato à mão
 *   no painel, esse nome vence o nome do WhatsApp.
 * - Se não vier nome no webhook, não cria contato novo. Mantém o comportamento
 *   antigo (o Inbox mostra o telefone).
 * - É best-effort: qualquer falha aqui não pode derrubar o recebimento da
 *   mensagem.
 */

import { getSupabaseAdmin } from '@/lib/supabase'

/** Nome de perfil do WhatsApp tem limite de 25 caracteres, mas protegemos mesmo assim. */
const MAX_PROFILE_NAME_LENGTH = 120

function sanitizeProfileName(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim().replace(/\s+/g, ' ')
  if (!trimmed) return null
  return trimmed.slice(0, MAX_PROFILE_NAME_LENGTH)
}

/**
 * Garante que o contato exista e tenha nome.
 *
 * @returns o id do contato (ct_...) ou null se não foi possível resolver.
 */
export async function ensureContactWithProfileName(
  normalizedPhone: string,
  profileNameRaw: string | null | undefined
): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase || !normalizedPhone) return null

  const profileName = sanitizeProfileName(profileNameRaw)

  try {
    const { data: existing, error: selectError } = await supabase
      .from('contacts')
      .select('id, name')
      .eq('phone', normalizedPhone)
      .limit(1)
      .maybeSingle()

    if (selectError) {
      console.warn('[ContactProfile] Falha ao buscar contato:', selectError.message)
      return null
    }

    // Contato já existe
    if (existing) {
      const currentName = typeof existing.name === 'string' ? existing.name.trim() : ''

      // Só preenche se estiver vazio. Nome editado à mão sempre vence.
      if (!currentName && profileName) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ name: profileName, updated_at: new Date().toISOString() })
          .eq('id', existing.id)

        if (updateError) {
          console.warn('[ContactProfile] Falha ao atualizar nome:', updateError.message)
        } else {
          console.log(`👤 [ContactProfile] Nome preenchido para ${normalizedPhone}: "${profileName}"`)
        }
      }

      return existing.id
    }

    // Contato não existe. Só cria se a Meta mandou nome.
    if (!profileName) return null

    const { data: created, error: insertError } = await supabase
      .from('contacts')
      .insert({
        name: profileName,
        phone: normalizedPhone,
        status: 'Opt-in',
      })
      .select('id')
      .single()

    if (insertError) {
      // Corrida: outro webhook criou o mesmo contato entre o SELECT e o INSERT.
      console.warn('[ContactProfile] Falha ao criar contato:', insertError.message)
      const { data: retry } = await supabase
        .from('contacts')
        .select('id')
        .eq('phone', normalizedPhone)
        .limit(1)
        .maybeSingle()
      return retry?.id ?? null
    }

    console.log(`👤 [ContactProfile] Contato criado para ${normalizedPhone}: "${profileName}"`)
    return created?.id ?? null
  } catch (e) {
    console.warn('[ContactProfile] Exceção, seguindo sem nome:', e)
    return null
  }
}
