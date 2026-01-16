import httpStatus from 'http-status';
import _ from 'lodash';
import APIResponse from './APIResponse.js';

function routeValidator(path, validator) {
  // eslint-disable-next-line func-names
  return function (req, res, next) {
    // remove when re-adding middleware
    // next();
    try {
      // let Data;
      // if (Object.keys(req.query).length === 0) {
      //   Data = req.body;
      // } else {
      //   Data = req.query;
      // }
      // validator.validate(Data, (error) => {
      //   if (error) {
      //     return res
      //       .status(httpStatus.BAD_REQUEST)
      //       .json(new APIResponse(null, error.message, httpStatus.BAD_REQUEST));
      //   }
      //   return next();
      // });

      if (!['body', 'query', 'params'].includes(path)) {
        console.log(
          `#validation - checking only body, query or params, but got: ${path}`
        );
        return next();
      }
      const dataForValidation = _.get(req, path, null);
      const { value, error } = validator.validate(dataForValidation, {
        allowUnknown: false,
        stripUnknown: true
      });
      if (error) {
        const context = _.get(error, 'details[0].message', null);
        console.log('re.body', req.body);
        console.log(
          `#validation - Error encountered at path: "${
            req.path
          }", data: ${JSON.stringify(
            dataForValidation
          )}, context: ${context}\n${error}`
        );
        res
          .status(400)
          .json(new APIResponse({}, error.message, httpStatus.BAD_REQUEST));
      } else {
        // Overriding sanitized object
        req[path] = value;
        next();
      }
    } catch (error) {
      next(error);
    }
  };
}

export { routeValidator };
