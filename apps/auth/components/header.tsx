import Link from "next/link";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { getFeatureFlagWithDefault, getSystemSetting } from "@/lib/setup";

const Header = async () => {
	const [showLogo, brandName] = await Promise.all([
		getFeatureFlagWithDefault("show_logo", true),
		getSystemSetting("brand_name", "Orbit Auth"),
	]);
	return (
		<header className="h-14 bg-background border-b flex justify-between items-center border-border fixed top-0 z-50 w-full px-4">
			<Link href="/">
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
