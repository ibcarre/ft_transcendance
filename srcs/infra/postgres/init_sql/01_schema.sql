
CREATE TABLE users (
	id			uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	email		text NOT NULL UNIQUE,
	name		text NOT NULL,
	password	text NOT NULL,
	avatar_url	text
);

CREATE TABLE games (
	id			uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	status		text NOT NULL DEFAULT 'playing',
	CONSTRAINT	chk_status CHECK (status IN ('playing', 'finished', 'cancelled')),
	goal		int NOT NULL DEFAULT 100,
	CONSTRAINT	chk_goalLimit CHECK (goal >= 50 AND goal <= 1000),
	created_at	timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users_in_game (
	id			bigserial PRIMARY KEY,
	user_id		uuid NOT NULL REFERENCES users(id),
	game_id		uuid NOT NULL REFERENCES games(id),
	CONSTRAINT	uq_game_user UNIQUE (game_id, user_id),
	seat		int NOT NULL DEFAULT 0,
	CONSTRAINT	uq_game_seats UNIQUE (game_id, seat),
	CONSTRAINT	chk_maxSeat CHECK (seat >= 0 AND seat <= 3),
	score		int NOT NULL DEFAULT 0
);

CREATE TABLE friends (
	id			  bigserial PRIMARY KEY,
	user_id		  uuid NOT NULL REFERENCES users(id),
	friend_id	  uuid NOT NULL REFERENCES users(id),
	requested_by  uuid NOT NULL REFERENCES users(id),
	accepted	  boolean NOT NULL DEFAULT false,

	CONSTRAINT	  chk_usrValue CHECK (user_id < friend_id),
	CONSTRAINT	  chk_reqByOne CHECK (requested_by = user_id OR requested_by = friend_id),
	CONSTRAINT	  uq_oneTime UNIQUE (user_id, friend_id)
);

CREATE TABLE private_msgs (
	id				bigserial PRIMARY KEY,
	sender_id		uuid NOT NULL REFERENCES users(id),
	receiver_id	uuid NOT NULL REFERENCES users(id),
	CONSTRAINT		chk_notAlone CHECK (sender_id <> reiceiver_id),
	body			text NOT NULL,
	CONSTRAINT		chq_emptyMsg CHECK (body <> ''),
	send_at			timestamptz NOT NULL DEFAULT now()
);
