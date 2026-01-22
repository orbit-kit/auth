// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: process.env.DOCS_SITE || undefined,
	base: process.env.DOCS_BASE || '/',
	integrations: [
		starlight({
			title: 'Orbit Auth',
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Alpha Status', slug: 'guides/alpha' },
						{ label: 'SDK', slug: 'guides/sdk' },
						{ label: 'React Install', slug: 'guides/react' },
						{ label: 'Hosting', slug: 'guides/hosting' },
						{ label: 'OAuth Clients', slug: 'guides/oauth-clients' },
						{ label: 'Admin', slug: 'guides/admin' },
						{ label: 'Google', slug: 'guides/google' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
	],
});
