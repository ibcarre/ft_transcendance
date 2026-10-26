#!/usr/bin/env bash

STATE=.last_user_id
PASS=1Qwertyuiop.
URL=https://localhost:8443

if [[ -f "$STATE" ]]; then
	start=$(( $(cat "$STATE") + 1 ))
else
	start=$((RANDOM + RANDOM))
fi

end=$((start + 9))
echo "$end" > "$STATE"

echo "=== signup 10 nouveaux users : test${start} .. test${end}"
for code in $(seq "$start" "$end"); do
	EMAIL=test${code}@gmail.com
	echo ${EMAIL}\n
	curl -sS -k -d "email=${EMAIL}&password=${PASS}&username=test${code}" \
		"${URL}/api/user/signup"
	echo
done

echo "=== re-signup 5 (doit échouer) : test${start} .. test$((start + 4))"
for code in $(seq "$start" $((start + 3))); do
	EMAIL=test${code}@gmail.com
	curl -sS -k -d "email=${EMAIL}&password=${PASS}&username=test${code}" \
		"${URL}/api/user/signup"
	echo
done

echo "=== login 5 OK : test${start} .. test$((start + 4))"
for code in $(seq "$start" $((start + 4))); do
	EMAIL=test${code}@gmail.com
	curl -sS -k -d "email=${EMAIL}&password=${PASS}" \
		"${URL}/api/user/login"
	echo
done

echo "=== login 6 KO : testa${start} .. testa$((start + 5))"
for code in $(seq "$start" $((start + 6))); do
	EMAIL=test${code}q@gmail.com
	curl -sS -k -d "email=${EMAIL}&password=${PASS}" \
		"${URL}/api/user/login"
	echo
done
