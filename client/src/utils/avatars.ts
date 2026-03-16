import avatar1 from "../assets/avatar1.svg";
import avatar2 from "../assets/avatar2.svg";
import avatar3 from "../assets/avatar3.svg";

const AVATARS = [avatar1, avatar2, avatar3];

export const randomAvatar = () => AVATARS[Math.floor(Math.random() * AVATARS.length)];

/** Deterministic avatar for a given name — same user always gets same avatar */
export const avatarForName = (name: string) =>
  AVATARS[name.charCodeAt(0) % AVATARS.length];
