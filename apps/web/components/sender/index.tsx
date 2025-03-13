'use client';
import { CloudUploadOutlined, LinkOutlined } from '@ant-design/icons';
import {
  Attachments,
  AttachmentsProps,
  Sender,
  SenderProps,
} from '@ant-design/x';
import { Button, GetProp, GetRef } from 'antd';
import React, { FC, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

export interface SenderInputProps extends SenderProps {}

const SenderInput: FC<SenderProps> = ({ ...reset }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<GetProp<AttachmentsProps, 'items'>>([]);
  const [text, setText] = useState('');
  const t = useTranslations('sender');

  const attachmentsRef = useRef<GetRef<typeof Attachments>>(null);

  const senderRef = useRef<GetRef<typeof Sender>>(null);

  const senderHeader = (
    <Sender.Header
      title={t('attachments')}
      styles={{
        content: {
          padding: 0,
        },
      }}
      open={open}
      onOpenChange={setOpen}
      forceRender
    >
      <Attachments
        ref={attachmentsRef}
        // Mock not real upload file
        beforeUpload={() => false}
        items={items}
        onChange={({ fileList }) => setItems(fileList)}
        placeholder={(type) =>
          type === 'drop'
            ? {
                title: t('dropFileHere'),
              }
            : {
                icon: <CloudUploadOutlined />,
                title: t('uploadFiles'),
                description: t('dragToUpload'),
              }
        }
        getDropContainer={() => senderRef.current?.nativeElement}
      />
    </Sender.Header>
  );

  return (
    <Sender
      header={senderHeader}
      prefix={
        <Button
          type="text"
          icon={<LinkOutlined />}
          onClick={() => {
            setOpen(!open);
          }}
        />
      }
      value={text}
      onChange={setText}
      onPasteFile={(file) => {
        attachmentsRef.current?.upload(file);
        setOpen(true);
      }}
      {...reset}
    ></Sender>
  );
};

export default SenderInput;
