import React from 'react';
import { useTranslation } from 'react-i18next';
import { DeleteConfirmModal } from '../../components/DeleteConfirmModal';
import { ErrorModal } from '../../components/ErrorModal';
import { ImagePrepModal } from '../../../../components/image/ImagePrepModal';

interface ModalsProps {
  deleteModalOpen: boolean;
  confirmDelete: () => void;
  cancelDelete: () => void;
  errorModalOpen: boolean;
  setErrorModalOpen: (val: boolean) => void;
  errorMessage: string;
  // Prep modal state
  userImagePrepOpen: boolean;
  userImagePrepFile: File | null;
  openUserImagePrep: (file: File) => void;
  closeUserImagePrep: () => void;
  onPickSource: (file: File, options?: any) => Promise<void>;
  fabricPrepOpen: boolean;
  fabricPrepFile: File | null;
  openFabricPrep: (file: File) => void;
  closeFabricPrep: () => void;
  onPickFabric: (file: File, options?: any) => Promise<void>;
  fabricMaterial: 'silk' | 'cotton' | 'transparent' | 'velvet' | 'linen' | 'wool' | null;
  setFabricMaterial: (val: any) => void;
}

export const DesignerModals: React.FC<ModalsProps> = (props) => {
  const { t } = useTranslation(['designer']);
  const {
    deleteModalOpen, confirmDelete, cancelDelete,
    errorModalOpen, setErrorModalOpen, errorMessage,
    userImagePrepOpen, userImagePrepFile, openUserImagePrep, closeUserImagePrep, onPickSource,
    fabricPrepOpen, fabricPrepFile, openFabricPrep, closeFabricPrep, onPickFabric,
    fabricMaterial, setFabricMaterial
  } = props;

  return (
    <>
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        itemName={t('deleteGeneration')}
      />

      <ErrorModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title={t('errorTitle')}
        message={errorMessage}
      />

      {/* Template Prep (Crop + Privacy) */}
      <ImagePrepModal
        isOpen={userImagePrepOpen}
        file={userImagePrepFile}
        onCancel={closeUserImagePrep}
        onReplaceFile={openUserImagePrep}
        mode="template"
        theme="designer"
        onApply={async (processed, meta) => {
          closeUserImagePrep();
          await onPickSource(processed, {
            skipPrivacy: meta?.privacyApplied,
            deferCompression: true
          });
        }}
      />

      {/* Fabric Prep (Crop + Material) */}
      <ImagePrepModal
        isOpen={fabricPrepOpen}
        file={fabricPrepFile}
        onCancel={closeFabricPrep}
        onReplaceFile={openFabricPrep}
        mode="fabric"
        theme="designer"
        fabricMaterial={fabricMaterial}
        onFabricMaterialChange={setFabricMaterial}
        onApply={async (processed) => {
          closeFabricPrep();
          await onPickFabric(processed, {
            deferCompression: true
          });
        }}
      />
    </>
  );
};
