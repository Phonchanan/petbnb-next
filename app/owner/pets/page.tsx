/* eslint-disable @next/next/no-location-assign-relative-destination */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
'use client';

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  Camera,
  CheckCircle2,
  Loader2,
  PawPrint,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import {
  AuthService,
  type CurrentProfile,
} from '@/lib/auth';

import {
  PetService,
  type Pet,
  type PetCategoryId,
  type PetGender,
} from '@/lib/supabase/petService';

const categories: {
  id: PetCategoryId;
  name: string;
  icon: string;
}[] = [
  {
    id: 'CANINE_FELINE',
    name: 'สุนัขและแมว',
    icon: '🐶',
  },
  {
    id: 'SMALL_MAMMALS',
    name: 'สัตว์เลี้ยงลูกด้วยนมขนาดเล็ก',
    icon: '🐹',
  },
  {
    id: 'REPTILES_AMPHIBIANS_AQUATICS',
    name: 'สัตว์เลื้อยคลานและสัตว์น้ำ',
    icon: '🦎',
  },
  {
    id: 'ORNAMENTAL_BIRDS_AVIANS',
    name: 'นกและสัตว์ปีกสวยงาม',
    icon: '🦜',
  },
];

interface PetFormState {
  name: string;
  categoryId: PetCategoryId;
  breed: string;
  gender: PetGender;

  ageYears: string;
  weightKg: string;

  foodInfo: string;
  feedingSchedule: string;

  allergies: string;
  medicalConditions: string;
  medication: string;

  behaviorNotes: string;
  specialNeeds: string;
  emergencyContact: string;

  isVaccinated: boolean;
  isSpayed: boolean;
}

const initialForm: PetFormState = {
  name: '',
  categoryId: 'CANINE_FELINE',
  breed: '',
  gender: 'UNKNOWN',

  ageYears: '',
  weightKg: '',

  foodInfo: '',
  feedingSchedule: '',

  allergies: '',
  medicalConditions: '',
  medication: '',

  behaviorNotes: '',
  specialNeeds: '',
  emergencyContact: '',

  isVaccinated: false,
  isSpayed: false,
};

export default function OwnerPetsPage() {
  const [profile, setProfile] =
    useState<CurrentProfile | null>(null);

  const [pets, setPets] =
    useState<Pet[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingPet, setEditingPet] =
    useState<Pet | null>(null);

  const [form, setForm] =
    useState<PetFormState>(initialForm);

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState<string | null>(null);

  const loadPets = async () => {
    try {
      setLoading(true);
      setError('');

      const current =
        await AuthService.getCurrentProfile();

      if (!current) {
        window.location.href = '/login';
        return;
      }

      if (!current.is_active) {
        await AuthService.signOut();
        window.location.href = '/login';
        return;
      }

      if (
        current.role.toUpperCase() !== 'OWNER'
      ) {
        if (
          current.role.toUpperCase() ===
          'SITTER'
        ) {
          window.location.href = '/sitter';
        } else {
          window.location.href = '/admin';
        }

        return;
      }

      setProfile(current);

      const data =
        await PetService.getPetsByOwner(
          current.id
        );

      setPets(data);
    } catch (err) {
      console.error(
        'LOAD PETS ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถโหลดข้อมูลสัตว์เลี้ยงได้'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPets();
  }, []);

  useEffect(() => {
    return () => {
      if (
        imagePreview?.startsWith('blob:')
      ) {
        URL.revokeObjectURL(
          imagePreview
        );
      }
    };
  }, [imagePreview]);

  const resetImage = () => {
    if (
      imagePreview?.startsWith('blob:')
    ) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setSelectedImage(null);
    setImagePreview(null);
  };

  const openAdd = () => {
    setEditingPet(null);
    setForm(initialForm);

    resetImage();

    setError('');
    setMessage('');
    setModalOpen(true);
  };

  const openEdit = (pet: Pet) => {
    setEditingPet(pet);

    if (
      imagePreview?.startsWith('blob:')
    ) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setSelectedImage(null);

    setImagePreview(
      pet.photoUrl || null
    );

    setForm({
      name: pet.name,

      categoryId:
        pet.categoryId,

      breed:
        pet.breed || '',

      gender:
        pet.gender,

      ageYears:
        pet.ageYears !== null
          ? String(pet.ageYears)
          : '',

      weightKg:
        pet.weightKg !== null
          ? String(pet.weightKg)
          : '',

      foodInfo:
        pet.foodInfo || '',

      feedingSchedule:
        pet.feedingSchedule || '',

      allergies:
        pet.allergies || '',

      medicalConditions:
        pet.medicalConditions || '',

      medication:
        pet.medication || '',

      behaviorNotes:
        pet.behaviorNotes || '',

      specialNeeds:
        pet.specialNeeds || '',

      emergencyContact:
        pet.emergencyContact || '',

      isVaccinated:
        pet.isVaccinated === true,

      isSpayed:
        pet.isSpayed === true,
    });

    setError('');
    setMessage('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (
      imagePreview?.startsWith('blob:')
    ) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setModalOpen(false);
    setEditingPet(null);

    setSelectedImage(null);
    setImagePreview(null);

    setForm(initialForm);
  };

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (
      !allowedTypes.includes(file.type)
    ) {
      setError(
        'รองรับเฉพาะไฟล์ JPG, PNG และ WEBP'
      );

      event.target.value = '';
      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        'รูปภาพต้องมีขนาดไม่เกิน 5 MB'
      );

      event.target.value = '';
      return;
    }

    if (
      imagePreview?.startsWith('blob:')
    ) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    const previewUrl =
      URL.createObjectURL(file);

    setSelectedImage(file);
    setImagePreview(previewUrl);
    setError('');
  };

  const handleRemoveSelectedImage = () => {
    if (
      imagePreview?.startsWith('blob:')
    ) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setSelectedImage(null);

    if (editingPet?.photoUrl) {
      setImagePreview(
        editingPet.photoUrl
      );
    } else {
      setImagePreview(null);
    }
  };

  const handleSave = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!profile) {
      return;
    }

    if (!form.name.trim()) {
      setError(
        'กรุณากรอกชื่อสัตว์เลี้ยง'
      );
      return;
    }

    if (
      form.ageYears &&
      Number(form.ageYears) < 0
    ) {
      setError(
        'อายุสัตว์เลี้ยงต้องไม่ติดลบ'
      );
      return;
    }

    if (
      form.weightKg &&
      Number(form.weightKg) < 0
    ) {
      setError(
        'น้ำหนักสัตว์เลี้ยงต้องไม่ติดลบ'
      );
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');

      let photoUrl =
        editingPet?.photoUrl || '';

      if (selectedImage) {
        photoUrl =
          await PetService.uploadPetImage(
            profile.id,
            selectedImage
          );
      }

      const payload = {
        ownerId: profile.id,

        name:
          form.name.trim(),

        categoryId:
          form.categoryId,

        breed:
          form.breed.trim(),

        gender:
          form.gender,

        ageYears:
          form.ageYears
            ? Number(form.ageYears)
            : null,

        weightKg:
          form.weightKg
            ? Number(form.weightKg)
            : null,

        photoUrl,

        foodInfo:
          form.foodInfo.trim(),

        feedingSchedule:
          form.feedingSchedule.trim(),

        allergies:
          form.allergies.trim(),

        medicalConditions:
          form.medicalConditions.trim(),

        medication:
          form.medication.trim(),

        behaviorNotes:
          form.behaviorNotes.trim(),

        specialNeeds:
          form.specialNeeds.trim(),

        emergencyContact:
          form.emergencyContact.trim(),

        isVaccinated:
          form.isVaccinated,

        isSpayed:
          form.isSpayed,
      };

      if (editingPet) {
        await PetService.updatePet(
          editingPet.id,
          payload
        );

        setMessage(
          'แก้ไขข้อมูลสัตว์เลี้ยงเรียบร้อยแล้ว ✨'
        );
      } else {
        await PetService.createPet(
          payload
        );

        setMessage(
          'เพิ่มสัตว์เลี้ยงเรียบร้อยแล้ว 🎉'
        );
      }

      closeModal();

      await loadPets();
    } catch (err) {
      console.error(
        'SAVE PET ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถบันทึกข้อมูลได้'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    pet: Pet
  ) => {
    const confirmed =
      window.confirm(
        `ต้องการลบข้อมูล "${pet.name}" ใช่หรือไม่?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setMessage('');

      await PetService.deletePet(
        pet.id
      );

      setMessage(
        `ลบข้อมูล ${pet.name} เรียบร้อยแล้ว`
      );

      await loadPets();
    } catch (err) {
      console.error(
        'DELETE PET ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถลบข้อมูลได้'
      );
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF8FE]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-75 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

          <p className="text-xs font-medium text-slate-400">
            กำลังโหลดข้อมูลสัตว์เลี้ยง...
          </p>
        </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8FE]">
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
      <section className="relative mb-6 flex flex-col gap-5 overflow-hidden rounded-[30px] bg-gradient-to-r from-[#EEDFFF] via-[#E8D8FF] to-[#DDC8FF] p-5 shadow-[0_12px_35px_rgba(109,40,217,0.10)] sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/35 blur-2xl" />
        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-purple-600">
            <PawPrint className="h-3.5 w-3.5" />
            My Pets
          </div>

          <h1 className="text-2xl font-black tracking-tight text-[#2E1065] sm:text-3xl">
            สัตว์เลี้ยงของฉัน
          </h1>

          <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-purple-950/60">
            จัดการรูปภาพ อายุ สุขภาพ อาหาร
            พฤติกรรม และข้อมูลสำคัญของน้องๆ
          </p>
        </div>

        <div className="relative flex flex-col gap-2 sm:items-end">
          <div className="text-xs font-bold text-purple-950/60">
            มีข้อมูลสัตว์เลี้ยง {pets.length} ตัว
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] px-5 py-3 text-sm font-black text-white shadow-[0_8px_18px_rgba(124,58,237,0.20)] transition hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            เพิ่มสัตว์เลี้ยงใหม่
          </button>
        </div>
      </section>

      {message && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </div>
      )}

      {error && !modalOpen && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {pets.length === 0 ? (
        <section className="rounded-[28px] bg-white p-12 text-center shadow-[0_8px_30px_rgba(76,29,149,0.05)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-100 text-purple-600">
            <PawPrint className="h-8 w-8" />
          </div>

          <h2 className="mt-4 font-bold text-purple-950">
            ยังไม่มีข้อมูลสัตว์เลี้ยง
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            เพิ่มข้อมูลและรูปภาพของน้องเพื่อเริ่มใช้งาน
          </p>

          <button
            type="button"
            onClick={openAdd}
            className="mt-5 rounded-2xl bg-[#7C3AED] px-5 py-2.5 text-xs font-black text-white"
          >
            + เพิ่มสัตว์เลี้ยง
          </button>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {pets.map((pet) => {
            const category =
              categories.find(
                (item) =>
                  item.id ===
                  pet.categoryId
              );

            return (
              <article
                key={pet.id}
                className="overflow-hidden rounded-[28px] bg-white shadow-[0_8px_30px_rgba(76,29,149,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(76,29,149,0.09)]"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[22px] bg-purple-50 shadow-sm">
                      {pet.photoUrl ? (
                        <img
                          src={pet.photoUrl}
                          alt={pet.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl">
                          {category?.icon || '🐾'}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-black text-purple-950">
                            {pet.name}
                          </h2>

                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {pet.breed ||
                              'ไม่ระบุสายพันธุ์'}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-700">
                          {category?.icon}{' '}
                          {category?.name}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <InfoBadge>
                          {pet.gender === 'MALE'
                            ? '♂ เพศผู้'
                            : pet.gender === 'FEMALE'
                              ? '♀ เพศเมีย'
                              : 'ไม่ระบุเพศ'}
                        </InfoBadge>

                        {pet.ageYears !== null && (
                          <InfoBadge>
                            อายุ {pet.ageYears} ปี
                          </InfoBadge>
                        )}

                        <InfoBadge>
                          {pet.weightKg !== null
                            ? `${pet.weightKg} กก.`
                            : 'ไม่ระบุน้ำหนัก'}
                        </InfoBadge>

                        {pet.isVaccinated && (
                          <InfoBadge>
                            ฉีดวัคซีนแล้ว ✅
                          </InfoBadge>
                        )}

                        {pet.isSpayed && (
                          <InfoBadge>
                            ทำหมันแล้ว ✅
                          </InfoBadge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 rounded-[20px] bg-[#F8F4FF] p-4 text-xs">
                    {pet.foodInfo && (
                      <PetDetail
                        label="อาหาร"
                        value={pet.foodInfo}
                      />
                    )}

                    {pet.feedingSchedule && (
                      <PetDetail
                        label="ตารางอาหาร"
                        value={
                          pet.feedingSchedule
                        }
                      />
                    )}

                    {pet.behaviorNotes && (
                      <PetDetail
                        label="พฤติกรรม"
                        value={
                          pet.behaviorNotes
                        }
                      />
                    )}

                    {pet.medication && (
                      <PetDetail
                        label="ยา"
                        value={pet.medication}
                      />
                    )}

                    {pet.allergies && (
                      <PetDetail
                        label="สิ่งที่แพ้"
                        value={pet.allergies}
                      />
                    )}

                    {pet.specialNeeds && (
                      <PetDetail
                        label="ดูแลพิเศษ"
                        value={
                          pet.specialNeeds
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-purple-100/70 bg-[#FBF9FE] p-4">
                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(pet)
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    ลบ
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openEdit(pet)
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs font-bold text-purple-700 transition hover:bg-purple-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    แก้ไขข้อมูล
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[30px] bg-white shadow-[0_24px_80px_rgba(46,16,101,0.20)]">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-purple-100/70 bg-white/95 p-5 backdrop-blur">
              <div>
                <h2 className="font-black text-purple-950">
                  {editingPet
                    ? 'แก้ไขข้อมูลสัตว์เลี้ยง'
                    : 'เพิ่มสัตว์เลี้ยงใหม่'}
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  กรอกข้อมูลที่จำเป็นเพื่อช่วยให้ผู้รับฝากดูแลน้องได้ถูกต้อง
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl bg-purple-50 p-2 text-purple-600 transition hover:bg-purple-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="space-y-5 p-5 sm:p-6"
            >
              <section>
                <div className="mb-3">
                  <p className="text-sm font-black text-purple-950">รูปสัตว์เลี้ยง</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">ช่วยให้ผู้รับฝากจดจำน้องได้ง่ายขึ้น</p>
                </div>

                <div className="rounded-3xl border border-dashed border-purple-200 bg-[#FAF8FE] p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative mx-auto h-32 w-32 shrink-0 overflow-hidden rounded-[26px] border border-purple-100 bg-white shadow-sm sm:mx-0">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-purple-300">
                          <Camera className="h-8 w-8" />
                          <span className="text-[10px] font-bold">
                            ยังไม่มีรูป
                          </span>
                        </div>
                      )}

                      {selectedImage && (
                        <button
                          type="button"
                          onClick={
                            handleRemoveSelectedImage
                          }
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-md"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-xs font-bold text-purple-950">
                        เลือกรูปน้อง
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-slate-400">
                        รองรับ JPG, PNG และ WEBP
                        ขนาดไม่เกิน 5 MB
                      </p>

                      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2.5 text-xs font-bold text-purple-700 transition hover:bg-purple-50">
                        <Upload className="h-4 w-4" />

                        {imagePreview
                          ? 'เลือกรูปใหม่'
                          : 'เลือกรูปจากเครื่อง'}

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={
                            handleImageChange
                          }
                          className="hidden"
                        />
                      </label>

                      {selectedImage && (
                        <p className="mt-2 max-w-full truncate text-[10px] text-emerald-600">
                          เลือกแล้ว:{' '}
                          {selectedImage.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[24px] bg-[#FBF9FE] p-4 sm:p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-black text-purple-950">ข้อมูลทั่วไป</h3>
                  <p className="mt-0.5 text-[10px] text-slate-400">ชื่อ ประเภท สายพันธุ์ อายุ และน้ำหนัก</p>
                </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="ชื่อสัตว์เลี้ยง *"
                  value={form.name}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      name: value,
                    })
                  }
                  required
                />

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-purple-950">
                    ประเภทสัตว์ *
                  </label>

                  <select
                    value={
                      form.categoryId
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        categoryId:
                          event.target
                            .value as PetCategoryId,
                      })
                    }
                    className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                  >
                    {categories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.icon}{' '}
                          {category.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <Field
                  label="สายพันธุ์"
                  value={form.breed}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      breed: value,
                    })
                  }
                />

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-purple-950">
                    เพศ
                  </label>

                  <select
                    value={form.gender}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        gender:
                          event.target
                            .value as PetGender,
                      })
                    }
                    className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                  >
                    <option value="UNKNOWN">
                      ไม่ระบุ
                    </option>

                    <option value="MALE">
                      เพศผู้
                    </option>

                    <option value="FEMALE">
                      เพศเมีย
                    </option>
                  </select>
                </div>

                <Field
                  label="อายุ (ปี)"
                  type="number"
                  value={form.ageYears}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      ageYears: value,
                    })
                  }
                  min="0"
                  step="1"
                />

                <Field
                  label="น้ำหนัก (กก.)"
                  type="number"
                  value={form.weightKg}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      weightKg: value,
                    })
                  }
                  min="0"
                  step="0.01"
                />
              </div>
              </section>

              <section className="rounded-[24px] bg-[#FBF9FE] p-4 sm:p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-black text-purple-950">การดูแลและสุขภาพ</h3>
                  <p className="mt-0.5 text-[10px] text-slate-400">กรอกเฉพาะข้อมูลที่ผู้รับฝากจำเป็นต้องทราบ</p>
                </div>

                <div className="space-y-4">
                  <TextAreaField
                    label="อาหาร"
                    value={form.foodInfo}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        foodInfo: value,
                      })
                    }
                    placeholder="เช่น อาหารเม็ด สูตร..."
                  />

                  <TextAreaField
                    label="ตารางการให้อาหาร"
                    value={
                      form.feedingSchedule
                    }
                    onChange={(value) =>
                      setForm({
                        ...form,
                        feedingSchedule:
                          value,
                      })
                    }
                    placeholder="เช่น เช้า 08:00 น. เย็น 18:00 น."
                  />

                  <TextAreaField
                    label="พฤติกรรม / นิสัย"
                    value={
                      form.behaviorNotes
                    }
                    onChange={(value) =>
                      setForm({
                        ...form,
                        behaviorNotes:
                          value,
                      })
                    }
                    placeholder="เช่น ขี้กลัว ตื่นคน เข้ากับสัตว์ตัวอื่นได้"
                  />

                  <TextAreaField
                    label="สิ่งที่แพ้"
                    value={form.allergies}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        allergies:
                          value,
                      })
                    }
                  />

                  <TextAreaField
                    label="โรคประจำตัว / สุขภาพ"
                    value={
                      form.medicalConditions
                    }
                    onChange={(value) =>
                      setForm({
                        ...form,
                        medicalConditions:
                          value,
                      })
                    }
                  />

                  <TextAreaField
                    label="ยาที่ใช้"
                    value={form.medication}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        medication:
                          value,
                      })
                    }
                  />

                  <TextAreaField
                    label="การดูแลพิเศษ"
                    value={
                      form.specialNeeds
                    }
                    onChange={(value) =>
                      setForm({
                        ...form,
                        specialNeeds:
                          value,
                      })
                    }
                  />

                  <Field
                    label="เบอร์ติดต่อฉุกเฉิน"
                    value={
                      form.emergencyContact
                    }
                    onChange={(value) =>
                      setForm({
                        ...form,
                        emergencyContact:
                          value,
                      })
                    }
                    type="tel"
                  />
                </div>
              </section>

              <div className="flex flex-wrap gap-4 rounded-[20px] bg-[#F1E8FF] p-4">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-purple-950">
                  <input
                    type="checkbox"
                    checked={
                      form.isVaccinated
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        isVaccinated:
                          event.target
                            .checked,
                      })
                    }
                    className="h-4 w-4 accent-purple-600"
                  />

                  ฉีดวัคซีนแล้ว
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-purple-950">
                  <input
                    type="checkbox"
                    checked={
                      form.isSpayed
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        isSpayed:
                          event.target
                            .checked,
                      })
                    }
                    className="h-4 w-4 accent-purple-600"
                  />

                  ทำหมันแล้ว
                </label>
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3 border-t border-purple-100 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="w-1/3 rounded-2xl border border-purple-200 bg-white py-3.5 text-sm font-bold text-purple-700 transition hover:bg-purple-50 disabled:opacity-50"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] py-3.5 text-sm font-black text-white shadow-[0_8px_18px_rgba(124,58,237,0.20)] transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />

                      {selectedImage
                        ? 'กำลังอัปโหลดและบันทึก...'
                        : 'กำลังบันทึก...'}
                    </>
                  ) : editingPet ? (
                    'บันทึกการแก้ไข'
                  ) : (
                    'เพิ่มสัตว์เลี้ยง'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}

function InfoBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-xl bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-700">
      {children}
    </span>
  );
}

function PetDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-2">
      <span className="w-24 shrink-0 font-bold text-purple-950">
        {label}:
      </span>

      <span className="wrap-break-word text-slate-600">
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-purple-950">
        {label}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        min={min}
        step={step}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-purple-950">
        {label}
      </label>

      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        rows={2}
        className="w-full resize-none rounded-2xl border border-purple-100 bg-[#FAF8FE] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
      />
    </div>
  );
}
