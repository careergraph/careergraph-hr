type Province = {
  code: number;
  name: string;
  districts: District[];
};

type District = {
  code: number;
  name: string;
  wards: Ward[];
};

type Ward = {
  code: number;
  name: string;
};

export type { Province, District, Ward };
