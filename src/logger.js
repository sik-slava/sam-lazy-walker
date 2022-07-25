
const makeLogger = (context = {}) => {
  const write = (level, message, ctx) => console.log(JSON.stringify({
    level,
    message,
    context: { ...context, ...ctx }
  }));

  return {
    for(context) {
      return makeLogger(context);
    },
    info(message, ctx = {}) {
      write('INFO', message, ctx)
    },
    warn(message, ctx = {}) {
      write('WARN', message, ctx)
    },
    error(e, message, ctx = {}) {
      write('ERROR', message, { errorName: e?.name, errorMessage: e?.message, ...ctx })
    }
  }
}

module.exports = makeLogger(); 
