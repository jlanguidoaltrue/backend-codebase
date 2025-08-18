import AppError from "../utils/AppError.js";

function replaceObject(target, src) {
  for (const k of Object.keys(target)) delete target[k];
  Object.assign(target, src);
}

export const validate = (schema) => (req, _res, next) => {
  try {
    const { error, value } = schema.validate(
      { body: req.body, query: req.query, params: req.params },
      { abortEarly: false, stripUnknown: true, convert: true }
    );

    if (error) {
      const details = error.details.map((d) => ({
        path: d.path.join("."),
        message: d.message,
        type: d.type,
      }));
      return next(new AppError("Validation failed", 400, details));
    }

    if (value.body) req.body = value.body; // body is safe to reassign
    if (value.query) replaceObject(req.query, value.query); // mutate instead of reassign
    if (value.params) replaceObject(req.params, value.params);

    next();
  } catch (e) {
    next(e);
  }
};
