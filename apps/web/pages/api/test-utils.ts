export function createRes() {
  const res: any = {};
  res.statusCode = 200;
  res.headers = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.jsonData = null;
  res.json = (data: any) => {
    res.jsonData = data;
    return res;
  };
  res.endCalled = false;
  res.end = () => {
    res.endCalled = true;
    return res;
  };
  return res;
}
