#/bin/bash
if ! command -v podman &>/dev/null; then
	printf "\033[0;32mDocker will be used\033[0m\n" >&2
	socket=/var/run/docker.sock
	container="docker"
else
	printf "\033[0;32mPodman will be used\033[0m\n" >&2
	sock_path=$(file ${XDG_RUNTIME_DIR}/podman/podman.sock | awk '{print $2}')

	if [[ ${sock_path} == "cannot" || ${sock_path} != "socket" ]]; then
		if [ ${sock_path} -ne "socket" ] ; then
			rmdir ${XDG_RUNTIME_DIR}/podman/podman.sock
		fi
	fi

		systemctl --user restart podman.socket
		status=$(systemctl --user status podman.socket | grep "Active:" | awk '{print $2}')

		if [ ${status} == "active" ] ; then
			socket=${XDG_RUNTIME_DIR}/podman/podman.sock
			container="podman"
			printf "\033[0;32mSocket can be used\033[0m\n"
		else
			printf "\033[0;31mSocket cannot be used\033[0m\n"
			exit 1
		fi

fi

env_file="${PWD}/srcs/.env"

sed -i "s#SOCKET=.*#SOCKET=${socket}#w changelog.txt" "$env_file"

if [ -s changelog.txt ]; then
	printf "\033[0;32m.env SOCKET changed : ${socket}\033[0m\n"
else
	printf "\033[0;36m.env SOCKET create  : ${socket} \033[0m\n"
	printf "\nSOCKET=${socket}\n" >> ${PWD}/srcs/.env
fi

rm -rf changelog.txt

sed -i "s#CONTAINER=.*#CONTAINER=${container}#w changelog.txt" "$env_file"
if [ -s changelog.txt ]; then
	printf "\033[0;32m.env CONTAINER changed : ${container}\033[0m\n"
else
	printf "\033[0;36m.env CONTAINER create  : ${container} \033[0m\n"
	printf "CONTAINER=${container}\n" >> ${PWD}/srcs/.env
fi

rm -rf changelog.txt
