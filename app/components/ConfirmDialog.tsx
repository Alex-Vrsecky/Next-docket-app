"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import React from "react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  trigger: React.ReactNode;
}

export default function ConfirmDialog({
  title,
  message,
  onConfirm,
  trigger,
}: ConfirmDialogProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <span onClick={onOpen}>{trigger}</span>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
              <ModalBody>
                <p>{message}</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                >
                  Yes, Delete
                </Button>
                <Button variant="light" onClick={onClose}>
                  Cancel
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
