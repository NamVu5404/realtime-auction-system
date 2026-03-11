import { App } from 'antd';
import { useEffect } from 'react';
import { setAntdStatic } from '../utils/antdStatic';

/**
 * AntdStaticSetter component
 * This component must be rendered inside <App> from antd.
 * It grabs the static instances from the useApp hook and publishes them
 * to the antdStatic helper so they can be used anywhere.
 */
export const AntdStaticSetter = () => {
  const { message, notification, modal } = App.useApp();

  useEffect(() => {
    setAntdStatic(message, notification, modal);
    console.log('[AntdStatic] Context-aware APIs registered');
  }, [message, notification, modal]);

  return null;
};
