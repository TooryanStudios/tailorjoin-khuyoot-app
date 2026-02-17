import React from 'react';
import { useAuth } from '../../../auth/useAuth';
import { getProductById } from '../../../../services/mockService';
import { useMeasurementTemplate } from '../../../hooks/useMeasurementTemplate';
import { measurementService } from '../../../modules/measurements/services/measurementService';
import { firebaseService } from '../../../services/firebase';
import {
  ConfirmationDialog,
  InfoDialog,
  MeasurementEditDialog,
  MeasurementSaveDialog,
  SavedMeasurementsSheet,
} from '../../../../pages/ProductDetails';

interface MeasurementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
}

export const MeasurementsModal: React.FC<MeasurementsModalProps> = ({ isOpen, onClose, productId }) => {
  const { user } = useAuth();
  const [product, setProduct] = React.useState<any>(null);
  const [template, setTemplate] = React.useState<any>(null);
  const measurementHook = useMeasurementTemplate({ template });

  const [savedMeasurementProfiles, setSavedMeasurementProfiles] = React.useState<any[]>([]);
  const [showSavedMeasurementsModal, setShowSavedMeasurementsModal] = React.useState(false);
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [saveDialogName, setSaveDialogName] = React.useState('');
  const [saveDialogError, setSaveDialogError] = React.useState('');
  const [isSavingMeasurement, setIsSavingMeasurement] = React.useState(false);
  const [pendingProfileToApply, setPendingProfileToApply] = React.useState<any | null>(null);
  const [showApplyConfirmation, setShowApplyConfirmation] = React.useState(false);
  const [infoDialog, setInfoDialog] = React.useState<{ title?: string; message: string } | null>(null);

  React.useEffect(() => {
    if (!isOpen || !productId) return;
    let mounted = true;

    const load = async () => {
      try {
        const loadedProduct = await getProductById(productId);
        if (!mounted) return;
        setProduct(loadedProduct || null);

        if (loadedProduct) {
          const loadedTemplate = await measurementService.getTemplateForProduct(loadedProduct);
          if (!mounted) return;
          setTemplate(loadedTemplate || null);
        } else {
          setTemplate(null);
        }
      } catch {
        if (!mounted) return;
        setProduct(null);
        setTemplate(null);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [isOpen, productId]);

  React.useEffect(() => {
    if (!user?.uid || !isOpen) return;
    firebaseService.getMeasurements(user.uid).then(setSavedMeasurementProfiles).catch(() => {
      setSavedMeasurementProfiles([]);
    });
  }, [user?.uid, isOpen]);

  const productType = product?.category || product?.type;

  const filteredMeasurementProfiles = React.useMemo(() => {
    if (!product) return [];
    return savedMeasurementProfiles.filter((profile) => {
      if (product?.id && profile.productId) {
        return profile.productId === product.id;
      }
      return profile.type === productType;
    });
  }, [savedMeasurementProfiles, product?.id, productType, product]);

  const handleSaveToProfile = () => {
    if (!user?.uid) {
      setInfoDialog({ message: 'يرجى تسجيل الدخول لحفظ المقاسات' });
      return;
    }

    const hasData = Object.keys(measurementHook.measurements).length > 0;
    if (!hasData) {
      setInfoDialog({ message: 'يرجى إدخال المقاسات أولاً' });
      return;
    }

    setSaveDialogError('');
    setSaveDialogName(`مقاس ${product?.name || ''}`.trim());
    setShowSaveDialog(true);
  };

  const handleSaveMeasurement = async (name: string) => {
    if (!user?.uid) return false;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setSaveDialogError('يرجى إدخال اسماً صالحاً للمقاس');
      return false;
    }

    setIsSavingMeasurement(true);
    try {
      const newProfile = {
        userId: user.uid,
        productId: product?.id,
        name: trimmedName,
        type: product?.category || product?.type || 'dress',
        metrics: measurementHook.measurements,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const profileId = await firebaseService.saveMeasurement(newProfile);
      setSavedMeasurementProfiles((prev) => [{ ...newProfile, id: profileId }, ...prev]);
      setInfoDialog({ title: 'تم الحفظ', message: 'تم حفظ المقاسات في ملفك الشخصي بنجاح.' });
      return true;
    } catch {
      setInfoDialog({ message: 'حدث خطأ أثناء حفظ المقاس' });
      return false;
    } finally {
      setIsSavingMeasurement(false);
    }
  };

  const handleConfirmSave = async () => {
    const saved = await handleSaveMeasurement(saveDialogName);
    if (saved) {
      setShowSaveDialog(false);
      setSaveDialogName('');
      setSaveDialogError('');
    }
  };

  const handleApplyProfile = (profile: any) => {
    if (!profile.metrics) return;

    const currentPointIds = new Set(template?.points?.map((p: any) => p.id) || []);
    const filteredMetrics: Record<string, number> = {};

    Object.entries(profile.metrics).forEach(([id, val]) => {
      if (currentPointIds.has(id)) {
        filteredMetrics[id] = val as number;
      }
    });

    measurementHook.setMeasurements(filteredMetrics);
    setShowSavedMeasurementsModal(false);
  };

  const handleProfileSelect = (profile: any) => {
    setPendingProfileToApply(profile);
    setShowSavedMeasurementsModal(false);
    setShowApplyConfirmation(true);
  };

  const handleApplyConfirmation = () => {
    if (!pendingProfileToApply) return;
    handleApplyProfile(pendingProfileToApply);
    setPendingProfileToApply(null);
    setShowApplyConfirmation(false);
  };

  const handleCancelApply = () => {
    setShowApplyConfirmation(false);
    setPendingProfileToApply(null);
  };

  const handleCancelSaveDialog = () => {
    setShowSaveDialog(false);
    setSaveDialogError('');
  };

  if (!isOpen) return null;

  return (
    <>
      <MeasurementEditDialog
        isOpen={isOpen}
        onClose={onClose}
        template={template}
        measurementHook={measurementHook}
        onSaveToProfile={handleSaveToProfile}
        onApplyProfile={() => setShowSavedMeasurementsModal(true)}
        productType={productType}
      />

      <SavedMeasurementsSheet
        isOpen={showSavedMeasurementsModal}
        onClose={() => setShowSavedMeasurementsModal(false)}
        profiles={filteredMeasurementProfiles}
        onSelect={handleProfileSelect}
      />

      <MeasurementSaveDialog
        isOpen={showSaveDialog}
        name={saveDialogName}
        error={saveDialogError}
        isSaving={isSavingMeasurement}
        onChange={setSaveDialogName}
        onCancel={handleCancelSaveDialog}
        onConfirm={handleConfirmSave}
      />

      <ConfirmationDialog
        isOpen={showApplyConfirmation && !!pendingProfileToApply}
        title="تحميل المقاس المحفوظ"
        description="هل ترغب في تطبيق هذا المقاس على المنتج الحالي؟"
        onCancel={handleCancelApply}
        onConfirm={handleApplyConfirmation}
      />

      <InfoDialog
        isOpen={!!infoDialog}
        title={infoDialog?.title}
        message={infoDialog?.message || ''}
        onClose={() => setInfoDialog(null)}
      />
    </>
  );
};
