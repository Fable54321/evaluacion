import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchWithAuth } from "../Utils/fetchWithAuth";
import { useAuth } from "../Contexts/AuthContext";

export type Worker = {
  id: number;
  username: string;
  name: string;
  surname: string;
  email: string | null;
  birth_date: string;
  residence_country: string;
  phone_number: string;
  job_title: string;
  job_description: string;
  hourly_wage: number | string;
  debut_date: string;
  job_duration: string;
  approximative_daily_hours: number;
  approximative_weekly_hours: number;
  pin: string;
  is_connected: boolean;
  contract_type: string;
  matricula: string;
  weekly_amount_deducted: number;
  monthly_amount_deducted: number;
  nas: string;
  ramq: string;
  folio_number: string;

  // From foreign_workers_schedule.foreign_workers_details
  foreign_workers_details_id?: number | null;
  has_license?: boolean | null;
  personal_picture_key?: string | null;
  personal_picture_url?: string | null;
  day_off?: string | null;
  job_id_1?: number | null;
  job_id_2?: number | null;
  job_id_3?: number | null;
  casa_id?: number | null;
  cuartos_id?: number | null;
  cuarto_name?: string | null;
  casa_name?: string | null;
};

export type Cuarto = {
  id: number;
  name: string;
  casa_id: number;
  casa_name: string;
  worker_count: number;
};

export type Contract = {
  id: number;
  user_id: number;
  status: string;
  signed_at: string;
  url: string;
  contract_slug: string;
};

type UploadPersonalPictureResponse = {
  message: string;
  detailsId: number;
  userId: number;
  personalPictureKey: string;
  personalPictureUrl: string;
};

type ForeignWorkersContextProps = {
  foreignWorkers: Worker[];
  setForeignWorkers: (workers: Worker[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string;
  setError: (error: string) => void;
  selectedWorker: Worker | null;
  setSelectedWorker: (worker: Worker | null) => void;
  fetchWorker: (id: number) => Promise<void>;
  contracts: Contract[];
  fetchContracts: (id: number) => Promise<void>;
  currentContract: Contract | null;
  fetchContractById: (id: number, contractId: number) => Promise<void>;
  workerLoading: boolean;
  workersListLoading: boolean;
  contractsLoading: boolean;
  updateLoading: boolean;
  pictureUploadLoading: boolean;
  updateWorkerInfo: (id: number, payload: Partial<Worker>) => Promise<void>;
  fetchCuartos: (casaId: number) => Promise<Cuarto[]>;
  updateWorkerCuarto: (id: number, cuartosId: number | null) => Promise<void>;
  uploadWorkerPersonalPicture: (id: number, file: File) => Promise<void>;
};

const ForeignWorkersContext = createContext({} as ForeignWorkersContextProps);

export function ForeignWorkersProvider({ children }: { children: ReactNode }) {
  const { user, authChecked } = useAuth();
  const [foreignWorkers, setForeignWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [workersListLoading, setWorkersListLoading] = useState(false);
  const [workerLoading, setWorkerLoading] = useState(false);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [pictureUploadLoading, setPictureUploadLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [currentContract, setCurrentContract] = useState<Contract | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchForeignWorkers = useCallback(async () => {
    try {
      setWorkersListLoading(true);

      const data = await fetchWithAuth<Worker[]>(
        `/portal/foreign-workers/foreign-workers`,
        {
          method: "GET",
        }
      );

      setForeignWorkers(data);
    } finally {
      setWorkersListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authChecked && user) {
      void fetchForeignWorkers();
    }
  }, [authChecked, user, fetchForeignWorkers]);

  const fetchWorker = useCallback(async (id: number) => {
    try {
      setWorkerLoading(true);

      const data = await fetchWithAuth<Worker>(
        `/portal/foreign-workers/foreign-workers/${id}`,
        {
          method: "GET",
        }
      );

      setSelectedWorker(data);
    } finally {
      setWorkerLoading(false);
    }
  }, []);

  const updateWorkerInfo = useCallback(
    async (id: number, payload: Partial<Worker>) => {
      try {
        setUpdateLoading(true);

        const data = await fetchWithAuth<{ worker: Worker }>(
          `/portal/foreign-workers/foreign-workers/${id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        setSelectedWorker(data.worker);
      } finally {
        setUpdateLoading(false);
      }
    },
    []
  );

  const fetchCuartos = useCallback(async (casaId: number) => {
    return fetchWithAuth<Cuarto[]>(`/rooms/cuartos?casa_id=${casaId}`, {
      method: "GET",
    });
  }, []);

  const updateWorkerCuarto = useCallback(
    async (id: number, cuartosId: number | null) => {
      try {
        setUpdateLoading(true);

        const data = await fetchWithAuth<{ worker: Partial<Worker> }>(
          `/rooms/workers/${id}/cuarto`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ cuartos_id: cuartosId }),
          }
        );

        setSelectedWorker((previousWorker) =>
          previousWorker ? { ...previousWorker, ...data.worker } : previousWorker
        );
      } finally {
        setUpdateLoading(false);
      }
    },
    []
  );

  const uploadWorkerPersonalPicture = useCallback(
    async (id: number, file: File) => {
      try {
        setPictureUploadLoading(true);

        const formData = new FormData();
        formData.append("picture", file);

        console.log("[personal-picture] context upload request", {
          workerId: id,
          fieldName: "picture",
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });

        const data = await fetchWithAuth<UploadPersonalPictureResponse>(
          `/portal/foreign-workers/foreign-workers/${id}/personal-picture`,
          {
            method: "PATCH",
            body: formData,
          }
        );

        console.log("[personal-picture] context upload response", {
          workerId: id,
          detailsId: data.detailsId,
          responseUserId: data.userId,
          personalPictureKey: data.personalPictureKey,
          hasPersonalPictureUrl: Boolean(data.personalPictureUrl),
          personalPictureUrl: data.personalPictureUrl,
        });

        setSelectedWorker((previousWorker) => {
          console.log("[personal-picture] updating selected worker", {
            workerId: id,
            hadPreviousWorker: Boolean(previousWorker),
            previousWorkerId: previousWorker?.id,
            willUpdate: Boolean(previousWorker && previousWorker.id === id),
          });

          if (!previousWorker || previousWorker.id !== id) {
            return previousWorker;
          }

          return {
            ...previousWorker,
            personal_picture_key: data.personalPictureKey,
            personal_picture_url: data.personalPictureUrl,
            foreign_workers_details_id: data.detailsId,
          };
        });

        setForeignWorkers((previousWorkers) =>
          previousWorkers.map((worker) =>
            worker.id === id
              ? {
                  ...worker,
                  personal_picture_key: data.personalPictureKey,
                  personal_picture_url: data.personalPictureUrl,
                }
              : worker
          )
        );
      } catch (error) {
        console.error("[personal-picture] context upload error", {
          workerId: id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          error,
        });
        throw error;
      } finally {
        setPictureUploadLoading(false);
      }
    },
    []
  );

  const fetchContracts = useCallback(async (id: number) => {
    try {
      setContractsLoading(true);

      const data = await fetchWithAuth<Contract[]>(
        `/portal/foreign-workers/foreign-workers/contracts/${id}`,
        {
          method: "GET",
        }
      );

      setContracts(data);
    } finally {
      setContractsLoading(false);
    }
  }, []);

  const fetchContractById = useCallback(
    async (id: number, contractId: number) => {
      const data = await fetchWithAuth<Contract>(
        `/portal/foreign-workers/foreign-workers/${id}/contracts/${contractId}`,
        {
          method: "GET",
        }
      );

      setCurrentContract(data);
    },
    []
  );

  const value = useMemo(
    () => ({
      foreignWorkers,
      setForeignWorkers,
      loading,
      setLoading,
      error,
      setError,
      selectedWorker,
      setSelectedWorker,
      fetchForeignWorkers,
      fetchWorker,
      fetchContracts,
      contracts,
      fetchContractById,
      currentContract,
      workerLoading,
      workersListLoading,
      contractsLoading,
      updateLoading,
      pictureUploadLoading,
      updateWorkerInfo,
      fetchCuartos,
      updateWorkerCuarto,
      uploadWorkerPersonalPicture,
    }),
    [
      foreignWorkers,
      loading,
      error,
      selectedWorker,
      fetchForeignWorkers,
      fetchWorker,
      fetchContracts,
      contracts,
      fetchContractById,
      currentContract,
      workerLoading,
      workersListLoading,
      contractsLoading,
      updateLoading,
      pictureUploadLoading,
      updateWorkerInfo,
      fetchCuartos,
      updateWorkerCuarto,
      uploadWorkerPersonalPicture,
    ]
  );

  return (
    <ForeignWorkersContext.Provider value={value}>
      {children}
    </ForeignWorkersContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useForeignWorkers() {
  const context = useContext(ForeignWorkersContext);

  if (!context) {
    throw new Error(
      "useForeignWorkers must be used inside a ForeignWorkersProvider"
    );
  }

  return context;
}
