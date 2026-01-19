import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ModalState {
  isUpgradeModalOpen: boolean;
  setIsUpgradeModalOpen: (open: boolean) => void;
}

export const useModalStore = create<ModalState>(
  persist(
    (set) => ({
      isUpgradeModalOpen: false,
      setIsUpgradeModalOpen: (open: boolean) => {
        set({ isUpgradeModalOpen: open });
      },
    }),
    {
      name: 'khuyoot-modals',
      version: 1,
    }
  )
);
