import type { BlockedUserDto } from "@/features/messaging/types/messaging.types";
import messagingApi from "@/features/messaging/api/messagingApi";

export const blockApi = {
  blockUser: async (userId: string, reason?: string): Promise<void> => {
    await messagingApi.blockUser(userId, reason);
  },
  unblockUser: async (userId: string): Promise<void> => {
    await messagingApi.unblockUser(userId);
  },
  getBlockedUsers: async (): Promise<BlockedUserDto[]> => messagingApi.getBlockedUsers(),
};

export default blockApi;
