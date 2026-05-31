// src/components/address/AddressList.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type AddressData,
} from '@/actions/addresses';
import { ADDRESS_MESSAGES } from '@/lib/constants/address.constants';
import { AddressCard } from '@/components/address/AddressCard';
import { AddressModal } from '@/components/address/AddressModal';

export function AddressList() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);

  // Load addresses
  useEffect(() => {
    const loadAddresses = async (): Promise<void> => {
      const result = await getAddresses();

      if (result.error) {
        toast.error(ADDRESS_MESSAGES.LOAD_ERROR);
        router.push('/sign-in');
        return;
      }

      setAddresses(result.data || []);
      setIsLoading(false);
    };

    loadAddresses();
  }, [router]);

  const handleAddNew = (): void => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleEdit = (address: AddressData): void => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleSave = async (formData: {
    label: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  }): Promise<void> => {
    if (editingAddress) {
      // Update
      const result = await updateAddress(editingAddress.id, formData);

      if (result.error) {
        toast.error(result.error);
        throw new Error(result.error);
      }

      setAddresses((prev) =>
        prev.map((addr) => (addr.id === editingAddress.id ? { ...addr, ...formData } : addr))
      );
      toast.success(ADDRESS_MESSAGES.UPDATE_SUCCESS, { icon: '✅' });
    } else {
      // Create
      const result = await createAddress(formData);

      if (result.error) {
        toast.error(result.error);
        throw new Error(result.error);
      }

      if (result.data) {
        setAddresses((prev) => [result.data!, ...prev]);
      }
      toast.success(ADDRESS_MESSAGES.SAVE_SUCCESS, { icon: '✅' });
    }
  };

  const handleDelete = async (addressId: string): Promise<void> => {
    const result = await deleteAddress(addressId);

    if (result.error) {
      toast.error(ADDRESS_MESSAGES.DELETE_ERROR);
      return;
    }

    setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
    toast.success(ADDRESS_MESSAGES.DELETE_SUCCESS, { icon: '🗑️' });
  };

  const handleSetDefault = async (addressId: string): Promise<void> => {
    const result = await setDefaultAddress(addressId);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === addressId,
      }))
    );
    toast.success(ADDRESS_MESSAGES.DEFAULT_SUCCESS, { icon: '⭐' });
  };

  // Loading
  if (isLoading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <Loader2 size={32} className="animate-spin" style={{ color: '#00A082' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              {ADDRESS_MESSAGES.PAGE_TITLE}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {ADDRESS_MESSAGES.PAGE_SUBTITLE}
            </p>
          </div>

          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 rounded-xl bg-[#00A082] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#008F74]"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{ADDRESS_MESSAGES.ADD_BUTTON}</span>
          </button>
        </motion.div>

        {/* Addresses List */}
        {addresses.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            {addresses.map((address, index) => (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <AddressCard
                  address={address}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-20"
          >
            <div
              className="mb-4 flex h-20 w-20 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            >
              <MapPin size={36} style={{ color: 'var(--color-text-tertiary)' }} />
            </div>
            <h3 className="mb-2 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              {ADDRESS_MESSAGES.EMPTY_TITLE}
            </h3>
            <p className="mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {ADDRESS_MESSAGES.EMPTY_SUBTITLE}
            </p>
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 rounded-xl bg-[#00A082] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#008F74]"
            >
              <Plus size={18} />
              {ADDRESS_MESSAGES.ADD_BUTTON}
            </button>
          </motion.div>
        )}
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAddress(null);
        }}
        onSave={handleSave}
        editingAddress={editingAddress}
      />
    </div>
  );
}
