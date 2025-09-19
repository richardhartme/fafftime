interface IconProps {
  name: string;
  prefix?: 'solid' | 'regular' | 'brands';
  className?: string;
  title?: string;
}

export function Icon({ name, prefix = 'solid', className = '', title }: IconProps): JSX.Element {
  const prefixClass = prefix === 'brands' ? 'fa-brands' : prefix === 'regular' ? 'fa-regular' : 'fa-solid';
  const baseClasses = 'inline-block mr-[0.35rem]';
  const classes = [baseClasses, prefixClass, `fa-${name}`, className].filter(Boolean).join(' ');

  return <i className={classes} aria-hidden={true} title={title}></i>;
}
