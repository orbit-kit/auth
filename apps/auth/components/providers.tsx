"use client";

import { QueryClientProvider } from "@tanstack/react-query";
// ReactQueryDevtools disabled due to Turbopack compatibility issues
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "@/data/query-client";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

type Props = {
	children: React.ReactNode;
};

const Providers = ({ children }: Props) => {
	const queryClient = getQueryClient();

	return (
		<ThemeProvider attribute="class" defaultTheme="dark">
			<QueryClientProvider client={queryClient}>
				{/* ReactQueryDevtools disabled due to Turbopack compatibility issues
				<ReactQueryDevtools
					client={queryClient}
					initialIsOpen={false}
					buttonPosition="bottom-right"
					position="bottom"
				/>
				*/}
				<Toaster richColors closeButton />
				{children}
			</QueryClientProvider>
		</ThemeProvider>
	);
};

export default Providers;
