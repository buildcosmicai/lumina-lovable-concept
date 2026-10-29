export function ownsConversation(ownerId: string, userId: string) {
  return Boolean(userId) && ownerId === userId;
}

export function conversationTitle(text: string) {
  return text.trim().replace(/\s+/g, " ").slice(0, 72) || "New conversation";
}