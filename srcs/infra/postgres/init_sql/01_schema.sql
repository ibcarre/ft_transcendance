
CREATE TABLE users (
	user_id		uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	email		text NOT NULL UNIQUE,
	name		text NOT NULL,
	password	text NOT NULL,
	avatar_url	text
);

CREATE TABLE games (
	game_id		uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	status		text NOT NULL DEFAULT 'playing',
	CONSTRAINT	chk_status CHECK (status IN ('playing', 'finished', 'cancelled')),
	goal		int NOT NULL DEFAULT 100,
	CONSTRAINT	chk_goalLimit CHECK (goal >= 50 AND goal <= 1000),
	created_at	timestamptz NOT NULL DEFAULT now()
);


