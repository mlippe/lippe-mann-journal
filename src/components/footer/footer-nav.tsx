import LinkRotate from "../link-rotate";

interface Props {
  title: string;
  links: {
    title: string;
    href: string;
  }[];
}

const FooterNav = ({ title, links }: Props) => {
  return (
    <div className="flex flex-col gap-6 sm:gap-8 items-center lg:items-start">
      <span className="text-xs uppercase font-mono tracking-[0.14em] font-medium opacity-75">{title}</span>
      <ul className="flex flex-col items-center lg:items-start gap-3 lg:gap-5 text-sm opacity-60">
        {links.map((link) => (
          <li key={link.href}>
            <LinkRotate
              link={link.href}
              label={link.title}
              className="text-text-default dark:text-text-inverse"
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FooterNav;
