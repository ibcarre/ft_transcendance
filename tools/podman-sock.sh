#/bin/bash
if [[ -x $(podman -v) ]]; then
	printf "\033[0;32mDocker will be used\033[0m\n" >&2
	socket=/var/run/docker.sock
	container="docker"
else
	type=$(file ${XDG_RUNTIME_DIR}/podman/podman.sock | awk '{print $2}')

if [[ ${type} == "cannot" || ${type} != "socket" ]]; then
	if [ ${type} -ne "socket" ] ; then
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


sed -i "s#SOCKET=.*#SOCKET=${socket}#w changelog.txt" ${PWD}/srcs/.env

if [ -s changelog.txt ]; then
	printf "\033[0;32m.env SOCKET changed : ${socket}\033[0m\n"
else
	printf "\033[0;36m.env SOCKET create  : ${socket} \033[0m\n"
	printf "\nSOCKET=${socket}\n" >> ${PWD}/srcs/.env
fi

sed -i "s#CONTAINER=.*#CONTAINER=${container}#w changelog0.txt" ${PWD}/srcs/.env
if [ -s changelog0.txt ]; then
	printf "\033[0;32m.env CONTAINER changed : ${container}\033[0m\n"
else
	printf "\033[0;36m.env CONTAINER create  : ${container} \033[0m\n"
	printf "CONTAINER=${container}\n" >> ${PWD}/srcs/.env
fi
