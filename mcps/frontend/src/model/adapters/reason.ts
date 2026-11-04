import type { Comment, Node } from '@babel/types';

/**
 * Whether the comments on these nodes give a reason for a choice the rules
 * would otherwise refuse: none, one that only points at the design, or the
 * author's own. A design may hold errors, so "the design asks for it" never
 * counts as a reason.
 */
export type Reason = 'none' | 'design' | 'own';

// "design system" and "design token" name the system, not the mockup.
const CITES_DESIGN = /\bdesign(?![\s-]*(system|token))(s|ed|er)?\b|\bmock-?ups?\b|\bfigma\b|\bwireframes?\b|\bspec(ification)?\b/i;

export function reasonOf(...nodes: (Node | null | undefined)[]): Reason {
  const comments: Comment[] = nodes.flatMap((node) => [...(node?.leadingComments ?? []), ...(node?.trailingComments ?? [])]);
  const texts = comments.map((comment) => comment.value.trim()).filter(Boolean);
  if (!texts.length) return 'none';
  return texts.some((text) => !CITES_DESIGN.test(text)) ? 'own' : 'design';
}

/** The sentence a finding ends with, telling how to keep the choice. */
export function reasonHint(reason: Reason): string {
  return reason === 'design'
    ? ' The comment only says the design asks for it, which is no reason: the design may be wrong. Say why it is right here, in your own words.'
    : ' If it is right here, say why in a comment on it, in your own words; "the design asks for it" is no reason.';
}
