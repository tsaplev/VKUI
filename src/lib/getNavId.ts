export interface NavIdProps {
  /** Уникальный идентификатор навигационного элемента (вместо id) */
  nav?: string;
  id?: string;
}

export function getNavId(props: NavIdProps, warn?: (text: string) => any) {
  const id = props.nav || props.id;
  if (process.env.NODE_ENV === 'development' && !id && warn) {
    warn('[getNavId] У навигационного элемента должно быть или свойство "nav", или свойство "id"');
  }
  return id;
}
