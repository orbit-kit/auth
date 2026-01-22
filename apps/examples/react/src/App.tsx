import { OrbitAuthWidget, useOrbitAuth } from "@orbit-kit/auth-sdk/react";
import "./App.css";

function AuthStatus() {
	const { session, isLoading, error, signIn, signOut, refreshSession } = useOrbitAuth();

	if (isLoading) {
		return <div className="loading">Loading...</div>;
	}

	if (error) {
		return (
			<div className="error">
				<p>Error: {error.message}</p>
				<button onClick={refreshSession}>Retry</button>
			</div>
		);
	}

	if (!session) {
		return (
			<div className="sign-in">
				<h2>Sign In</h2>
				<p>Authenticate with Orbit Auth to access the app.</p>
				<button className="btn-primary" onClick={() => signIn()}>
					Sign in with Orbit Auth
				</button>
			</div>
		);
	}

	return (
		<div className="signed-in">
			<div className="user-info">
				{session.user.image && (
					<img src={session.user.image} alt={session.user.name} className="avatar" />
				)}
				<div>
					<h2>Welcome, {session.user.name}</h2>
					<p className="email">{session.user.email}</p>
					{!session.user.emailVerified && (
						<p className="warning">Email not verified</p>
					)}
				</div>
			</div>
			<div className="actions">
				<button className="btn-secondary" onClick={refreshSession}>
					Refresh Session
				</button>
				<button className="btn-danger" onClick={signOut}>
					Sign Out
				</button>
			</div>
		</div>
	);
}

function AppContent() {
	return (
		<div className="app">
			<header className="header">
				<h1>Orbit Auth React Example</h1>
				<p className="subtitle">React + Orbit Auth SDK</p>
			</header>
			<main className="main">
				<AuthStatus />
			</main>
			<footer className="footer">
				<p>Powered by Orbit Auth</p>
			</footer>
		</div>
	);
}

function App() {
	const orbitAuthURL = import.meta.env.VITE_ORBIT_AUTH_URL || "http://localhost:5000";
	const clientId = import.meta.env.VITE_ORBIT_CLIENT_ID || "demo-client";
	const clientSecret = import.meta.env.VITE_ORBIT_CLIENT_SECRET || "";
	return (
		<OrbitAuthWidget
			baseURL={orbitAuthURL}
			clientId={clientId}
			clientSecret={clientSecret || undefined}
			redirectURI={`${window.location.origin}/`}
			signedOut={<AppContent />}
			signedIn={<AppContent />}
		/>
	);
}

export default App;
