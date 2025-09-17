import { nanoid } from "nanoid";

// [ IMPORTANT: HOW USER IS MANAGED, NO REAL AUTHENTICATION IS IMPLEMENTED HERE ]
// On first visit, when someone submit a vote, user will be created and userId will be stored in localStorage
// If userId already exists in localStorage, it will be reused and considered as the same user

// If you want to reset and create a new user, clear localStorage in browser devtools
export async function getOrCreateUser(socketUrl) {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    const res = await fetch(`${socketUrl}/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Guest-${nanoid(5)}`,
        email: `${nanoid(8)}@guest.local`,
        password: "123456",
      }),
    });
    const data = await res.json();
    userId = data.user.id;
    localStorage.setItem("userId", userId);
  }
  return userId;
}
