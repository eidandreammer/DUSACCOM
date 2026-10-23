(function (root) {
  'use strict';
  const utils = {
    validationMessage(field) {
      const value = typeof field.value === 'string' ? field.value.trim() : '';
      if (field.type === 'checkbox') return field.required && !field.checked ? 'Please agree before continuing.' : '';
      if (field.required && !value) return ({ name: 'Please enter your full name.', email: 'Please enter your email address.', interest: 'Please select a topic.', message: 'Please tell us a little more.' })[field.name] || 'Please complete this field.';
      if (!value) return '';
      if (field.name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address, such as you@company.com.';
      if (field.minLength > 0 && value.length < field.minLength) return field.name === 'message' ? 'Please write at least 10 characters.' : 'Please enter at least 2 characters.';
      if (field.maxLength > 0 && value.length > field.maxLength) return 'Please shorten this field.';
      return '';
    },
    emailDraft(data, recipient) {
      const subject = (data.interest ? `DUSACCOM inquiry: ${data.interest}` : 'DUSACCOM inquiry').replace(/[\r\n]+/g, ' ');
      const body = [`Hello DUSACCOM,`, '', data.message, '', `Name: ${data.name}`, `Email: ${data.email}`, data.company ? `Company: ${data.company}` : '', `Interest: ${data.interest}`, '', 'I consent to being contacted about this inquiry.'].filter(line => line !== undefined).join('\n');
      return { subject, body, href: `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
    },
    escapeHTML(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
  };
  root.DusaccomForms = utils;
})(globalThis);
