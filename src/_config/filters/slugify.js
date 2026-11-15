import slugifyModule from 'slugify';

// NodeNext reads slugify's types as a module object, not the callable default.
const slugify = /** @type {(value: string, options?: object) => string} */ (
  /** @type {any} */ (slugifyModule)
);

/** Converts string to a slug form. */
export const slugifyString = str => {
  return slugify(str, {
    replacement: '-',
    remove: /[#,&,+()$~%.'":*¿?¡!<>{}]/g,
    lower: true
  });
};
