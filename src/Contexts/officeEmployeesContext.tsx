import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export type OfficeEmployee = {
  id: number;
  username: string;
  name: string;
  surname: string;
  email: string | null;
  is_office: boolean;
  is_active: boolean;
};

type OfficeEmployeesResponse =
  | OfficeEmployee[]
  | {
      employees?: OfficeEmployee[];
      users?: OfficeEmployee[];
      data?: OfficeEmployee[];
    };

type OfficeEmployeesContextValue = {
  officeEmployees: OfficeEmployee[];
  officeEmployeesLoading: boolean;
  officeEmployeesError: string | null;
  fetchOfficeEmployees: () => Promise<void>;
};

const OfficeEmployeesContext = createContext<
  OfficeEmployeesContextValue | undefined
>(undefined);

const getEmployeesFromResponse = (response: OfficeEmployeesResponse) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.employees)) return response.employees;
  if (Array.isArray(response.users)) return response.users;
  if (Array.isArray(response.data)) return response.data;
  throw new Error("La liste des employés reçue est invalide.");
};

export function OfficeEmployeesProvider({ children }: { children: ReactNode }) {
  const [officeEmployees, setOfficeEmployees] = useState<OfficeEmployee[]>([]);
  const [officeEmployeesLoading, setOfficeEmployeesLoading] = useState(false);
  const [officeEmployeesError, setOfficeEmployeesError] = useState<
    string | null
  >(null);

  const fetchOfficeEmployees = useCallback(async () => {
    setOfficeEmployeesLoading(true);
    setOfficeEmployeesError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/portal-unprotected/list`, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(
          `Impossible de récupérer les employés (${response.status}).`,
        );
      }

      const data = (await response.json()) as OfficeEmployeesResponse;
      const employees = getEmployeesFromResponse(data);

      setOfficeEmployees(
        employees.filter(
          (employee) =>
            employee.is_office === true && employee.is_active === true,
        ),
      );
    } catch (error) {
      setOfficeEmployees([]);
      setOfficeEmployeesError(
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les employés de bureau.",
      );
    } finally {
      setOfficeEmployeesLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchOfficeEmployees();
  }, [fetchOfficeEmployees]);

  const value = useMemo(
    () => ({
      officeEmployees,
      officeEmployeesLoading,
      officeEmployeesError,
      fetchOfficeEmployees,
    }),
    [
      officeEmployees,
      officeEmployeesLoading,
      officeEmployeesError,
      fetchOfficeEmployees,
    ],
  );

  return (
    <OfficeEmployeesContext.Provider value={value}>
      {children}
    </OfficeEmployeesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOfficeEmployees() {
  const context = useContext(OfficeEmployeesContext);

  if (!context) {
    throw new Error(
      "useOfficeEmployees must be used inside an OfficeEmployeesProvider",
    );
  }

  return context;
}
