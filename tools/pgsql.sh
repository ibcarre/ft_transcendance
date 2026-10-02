#!/usr/bin/env bash
# IDs persistés dans .last_user_id pour ne pas recréer les users déjà en DB.

STATE=.last_user_id
PASS=XXX
URL=https://localhost:44443

if [[ -f "$STATE" ]]; then
	start=$(( $(cat "$STATE") + 1 ))
else
	start=$((RANDOM + RANDOM))
fi

end=$((start + 9))
echo "$end" > "$STATE"

echo "=== signup 10 nouveaux users : test${start} .. test${end}"
for code in $(seq "$start" "$end"); do
	curl -sS -k -d "email=test${code}&password=${PASS}&username=test${code}" \
		"${URL}/api/user/signup"
	echo
done

echo "=== re-signup 5 (doit échouer) : test${start} .. test$((start + 4))"
for code in $(seq "$start" $((start + 3))); do
	curl -sS -k -d "email=test${code}&password=${PASS}&username=test${code}" \
		"${URL}/api/user/signup"
	echo
done

echo "=== login 5 OK : test${start} .. test$((start + 4))"
for code in $(seq "$start" $((start + 4))); do
	curl -sS -k -d "email=test${code}&password=${PASS}" \
		"${URL}/api/user/login"
	echo
done

echo "=== login 6 KO : testa${start} .. testa$((start + 5))"
for code in $(seq "$start" $((start + 6))); do
	curl -sS -k -d "email=testa${code}&password=${PASS}" \
		"${URL}/api/user/login"
	echo
done
