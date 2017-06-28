export default function validateLog (args, ...tests) {
  return args.length === tests.length && args.every((arg, i) => {
    return tests[i].test(arg)
  })
}
