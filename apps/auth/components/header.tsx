import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

type HeaderProps = {
	brandName: string;
	showLogo: boolean;
};

const Header = ({ brandName, showLogo }: HeaderProps) => {
	return (
		<header className="h-14 bg-background border-b flex justify-between items-center border-border fixed top-0 z-50 w-full px-4">
			<Link to="/">
				<div className="flex items-center gap-2">
					{showLogo ? <Logo /> : null}
					<p className="select-none">{brandName}</p>
				</div>
			</Link>

			<ThemeToggle />
		</header>
	);
};

export default Header;
