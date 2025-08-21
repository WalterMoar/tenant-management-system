/**
 * Branded type for Service IDs to prevent mixing with other ID types.
 */
export type ServiceId = string & { readonly __brand: 'ServiceId' }

/**
 * Represents a service in the system.
 */
export class Service {
  /**
   * ISO8601 date string (YYYY-MM-DD) when service was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDate: string

  /**
   * Unique identifier for the service.
   */
  id: ServiceId

  /**
   * Display name of the service.
   */
  name: string

  /**
   * Creates a new Service instance.
   *
   * @param id - Unique identifier for the service
   * @param name - Display name of the service
   * @param createdDate - ISO8601 date string (YYYY-MM-DD) when service was
   *   created
   */
  constructor(id: ServiceId, name: string, createdDate: string) {
    this.createdDate = createdDate
    this.id = id
    this.name = name
  }

  /**
   * Creates a Service instance from API response data.
   *
   * Note: The API returns 'createdDateTime' which is mapped to the
   * 'createdDate' property.
   *
   * @param apiData - The raw service data from the API
   * @param apiData.createdDateTime - ISO8601 date string (YYYY-MM-DD) when
   *     service was created
   * @param apiData.id - Unique identifier for the service
   * @param apiData.name - Display name of the service
   * @returns A new Service instance
   */
  static fromApiData(apiData: {
    createdDateTime: string
    id: ServiceId
    name: string
  }): Service {
    return new Service(apiData.id, apiData.name, apiData.createdDateTime)
  }
}
