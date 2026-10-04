
if [ $(podman -v | awk '{print $1}') != "podman" ] ; then
	echo -e "\033[0;32mDocker will be used\033[0m"
	socket=/var/run/docker.sock
	container="docker"
	exit 43
fi


type=$(file ${XDG_RUNTIME_DIR}/podman/podman.sock | awk '{print $2}')

if [[ ${type} == "cannot" || ${type} -ne "socket" ]] ; then
	if [[ ${type} -ne "socket" ]] ; then
		rmdir ${XDG_RUNTIME_DIR}/podman/podman.sock
	fi
fi

systemctl --user restart podman.socket
status=$(systemctl --user status podman.socket | grep "Active:" | awk '{print $2}')

if [ ${status} == "active" ] ; then
	socket=${XDG_RUNTIME_DIR}/podman/podman.sock
	container="podman"
	echo -e "\033[0;32mSocket can be used\033[0m"
else
	echo -e "\033[0;31mSocket cannot be used\033[0m"
	exit 1
fi
sed -i "s#SOCKET=.*#SOCKET=${socket}#w changelog.txt" ${PWD}/srcs/.env

if [ -s changelog.txt ]; then
	echo -e "\033[0;32m.env SOCKET changed\033[0m"
else
	echo -e "\033[0;36m.env SOCKET create \033[0m"
	echo "SOCKET=${socket}" >> ${PWD}/srcs/.env
fi

sed -i "s#CONTAINER=.*#CONTAINER=${container}#w changelog0.txt" ${PWD}/srcs/.env
if [ -s changelog0.txt ]; then
	echo -e "\033[0;32m.env CONTAINER changed\033[0m"
else
	echo -e "\033[0;36m.env CONTAINER create \033[0m"
	echo "CONTAINER=${container}" >> ${PWD}/srcs/.env
fi
