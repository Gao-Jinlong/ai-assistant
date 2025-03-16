'use client';
import { CloudUploadOutlined, LinkOutlined } from '@ant-design/icons';
import {
  Attachments,
  AttachmentsProps,
  Sender,
  SenderProps,
} from '@ant-design/x';
import { Button, GetProp, GetRef } from 'antd';
import React, { FC, useRef, useState, forwardRef } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@web/lib/utils';

// 创建一个扩展接口
interface CustomSenderProps extends Omit<SenderProps, 'onSend'> {
  onSend: (text: string) => void | Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

const SenderInput = forwardRef<GetRef<typeof Sender>, CustomSenderProps>(
  ({ onSend, placeholder, disabled, isLoading, className, ...rest }, ref) => {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<GetProp<AttachmentsProps, 'items'>>([]);
    const [text, setText] = useState('');
    const t = useTranslations('sender');

    const attachmentsRef = useRef<GetRef<typeof Attachments>>(null);
    const senderRef = useRef<GetRef<typeof Sender>>(null);

    // 处理发送逻辑
    const handleSend = () => {
      if (text.trim() && !disabled && !isLoading) {
        onSend(text);
        setText('');
      }
    };

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
        {...rest}
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
        actions={
          <Button
            type="primary"
            onClick={handleSend}
            disabled={!text.trim() || disabled || isLoading}
            loading={isLoading}
          >
            {t('send')}
          </Button>
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        className={cn(className)}
        placeholder={placeholder}
        disabled={disabled}
        ref={ref}
      />
    );
  },
);

export default SenderInput;
