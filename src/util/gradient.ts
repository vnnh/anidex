//https://css-tricks.com/easing-linear-gradients/
export default (deg?: number, color = "0, 0%, 0%") => {
	return `
		linear-gradient(${deg}deg, hsl(${color}) 0%,
		hsla(${color}, 0.738) 19%,
		hsla(${color}, 0.541) 34%,
		hsla(${color}, 0.382) 47%,
		hsla(${color}, 0.278) 56.5%,
		hsla(${color}, 0.194) 65%,
		hsla(${color}, 0.126) 73%,
		hsla(${color}, 0.075) 80.2%,
		hsla(${color}, 0.042) 86.1%,
		hsla(${color}, 0.021) 91%,
		hsla(${color}, 0.008) 95.2%,
		hsla(${color}, 0.002) 98.2%,
		hsla(${color}, 0) 100%)
	`;
};
