import { cn } from "@/lib/utils";

interface Props {
  label: string;
  label2?: string;
  style?: string;
}

/**
 * WordRotate component displays a vertical rotation of different words when user hover it
 * @preview ![img]() - https://p.ecarry.me/components/word-rotate
 *
 * @param {Object} props - Component props
 * @param {string} props.label - first word
 * @param {string} props.label2 - second word
 * @param {string} props.style - Component styles
 * @returns {JSX.Element} JSX Element
 */

const WordRotate = ({ label, label2, style }: Props) => {
  return (
    <div className="relative inline-flex items-center overflow-hidden leading-tight">
      <div className={cn("relative inline-flex items-center group", style)}>
        {/* Default Text (visible initially, moves down on hover on desktop) */}
        <span className="block transform transition-transform duration-300 ease-in-out sm:group-hover:translate-y-[120%] select-none">
          {label}
        </span>

        {/* Hover Text (only on desktop/sm+, safely translated well outside container) */}
        {label2 && (
          <span
            aria-hidden="true"
            className="hidden sm:block absolute inset-0 flex items-center transform -translate-y-[120%] transition-transform duration-300 ease-in-out sm:group-hover:translate-y-0 select-none pointer-events-none whitespace-nowrap"
          >
            {label2}
          </span>
        )}
      </div>
    </div>
  );
};

export default WordRotate;
