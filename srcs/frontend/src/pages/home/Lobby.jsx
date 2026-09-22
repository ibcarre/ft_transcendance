import './Lobby.css';
export function Lobby() {
	return (
		<div className="lobby-container">
			
			{/* 1. L'en-tête avec les éléments des coins */}
			<header className="lobby-header">
				<h1>SKYJO</h1>
				<h2>Profil</h2>
			</header>

			{/* 2. Le contenu principal qui centre ton menu */}
			<div className="lobby-wrapper">
				<div className="button-container">
					<button className="lobby-button">Create a room</button>
					<button className="lobby-button">Find a room</button>
					<button className="lobby-button">Play offline</button>
				</div>
				<p className="privacy">Privacy Terms & Conditions</p>
			</div>
			
		</div>
	);
}