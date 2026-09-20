import './auth.css';

export function SignIn() {
	return (
		<div className="page-wrapper">
			<div className="auth-container">
				
				<div>
					<h1 className="SKYJO">SKYJO</h1>
				</div>
				
				<form className="Login-form">
					<h2>Login</h2>

					<div className="input-group">
						<label htmlFor="email" className="info">Email</label>
						<input
							id="email"
							className="auth-input"
							placeholder="exemple@email.com"
							type="email"
							required
						/>
					</div>

					<div className="input-group">
						<label htmlFor="password" className="info">Password</label>
						<input
							id="password"
							className="auth-input"
							placeholder="Password"
							type="password"
							required
						/>
						<p className="paragraph forgot-password">Forgot password?</p>
					</div>

					<button type="submit" className="auth-button">
						Sign in
					</button>

					<p className="paragraph">Don't have an account yet? Create one</p>
				</form>

			</div>
			<p className="privacy">Privacy Terms & Conditions</p>
		</div>
	);
}