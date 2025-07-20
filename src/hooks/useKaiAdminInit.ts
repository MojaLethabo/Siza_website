// hooks/useKaiAdminInit.ts
'use client';

import { useEffect } from 'react';
import $ from 'jquery';

// Extend the window object to include bootstrap
declare global {
  interface Window {
    bootstrap: typeof import('bootstrap');
  }
}

export default function useKaiAdminInit() {
  useEffect(() => {
    // Initialize Bootstrap tooltips and popovers if available
    if (typeof window !== 'undefined' && window.bootstrap) {
      const tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
      );
      tooltipTriggerList.forEach((tooltipTriggerEl: Element) => {
        new window.bootstrap.Tooltip(tooltipTriggerEl);
      });

      const popoverTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="popover"]')
      );
      popoverTriggerList.forEach((popoverTriggerEl: Element) => {
        new window.bootstrap.Popover(popoverTriggerEl);
      });
    }

    // Custom jQuery DOM behaviors for KaiAdmin
    $(function () {
      $('.form-group-default .form-control')
        .off('focus blur')
        .on('focus', function (this: HTMLInputElement) {
          $(this).parent().addClass('active');
        })
        .on('blur', function (this: HTMLInputElement) {
          $(this).parent().removeClass('active');
        });

      $('.show-password')
        .off('click')
        .on('click', function (this: HTMLElement) {
          const input = $(this).parent().find('input');
          input.attr('type', input.attr('type') === 'password' ? 'text' : 'password');
        });
    });
  }, []);
}
