interface UnitValue {
  Value: number | null;
  Unit: string;
  UnitType: number;
}

interface TemperatureRange {
  Minimum: UnitValue;
  Maximum: UnitValue;
  Average?: UnitValue; // for WetBulb, RelativeHumidity, etc.
}

interface Direction {
  Degrees: number;
  Localized: string;
  English: string;
}

interface Wind {
  Speed: UnitValue;
  Direction: Direction;
}

interface WindGust {
  Speed: UnitValue;
}

interface LocalSource {
  Id: number;
  Name: string;
  WeatherCode: string;
}

interface AirAndPollen {
  Name: string;
  Value: number | null;
  Category: string;
  CategoryValue: number;
  Type?: string;
}

// Forecast period (Day or Night)
interface ForecastPeriod {
  Icon: number;
  IconPhrase: string;
  LocalSource: LocalSource;
  HasPrecipitation: boolean;
  PrecipitationType?: string;
  PrecipitationIntensity?: string;

  ShortPhrase: string;
  LongPhrase: string;

  PrecipitationProbability: number | null;
  ThunderstormProbability: number | null;
  RainProbability: number | null;
  SnowProbability: number | null;
  IceProbability: number | null;

  Wind: Wind;
  WindGust: WindGust;

  TotalLiquid: UnitValue;
  Rain: UnitValue;
  Snow: UnitValue;
  Ice: UnitValue;

  HoursOfPrecipitation: number;
  HoursOfRain: number;
  CloudCover: number;

  Evapotranspiration: UnitValue;
  SolarIrradiance: UnitValue;

  RelativeHumidity: {
    Minimum: number;
    Maximum: number;
    Average: number;
  };

  WetBulbTemperature: TemperatureRange;
  WetBulbGlobeTemperature: TemperatureRange;
}

// Daily forecast
interface DailyForecast {
  Date: string;
  EpochDate: number;

  Sun: {
    Rise: string;
    EpochRise: number;
    Set: string;
    EpochSet: number;
  };

  Moon: {
    Rise: string;
    EpochRise: number;
    Set: string;
    EpochSet: number;
    Phase: string;
    Age: number;
  };

  Temperature: TemperatureRange;
  RealFeelTemperature: TemperatureRange;
  RealFeelTemperatureShade: TemperatureRange;

  HoursOfSun: number;

  DegreeDaySummary: {
    Heating: UnitValue;
    Cooling: UnitValue;
  };

  AirAndPollen: AirAndPollen[];

  Day: ForecastPeriod;
  Night: ForecastPeriod;

  Sources: string[];
  MobileLink: string;
  Link: string;
}

// Headline section
interface Headline {
  EffectiveDate: string;
  EffectiveEpochDate: number;
  Severity: number;
  Text: string;
  Category: string;
  EndDate: string | null;
  EndEpochDate: number;
  MobileLink: string;
  Link: string;
}

// Main forecast response
export interface AccuWeatherForecastResponse {
  Headline: Headline;
  DailyForecasts: DailyForecast[];
}

export interface AccuWeatherLocationResponse {
  Version: number;
  Key: string;
  Type: string;
  Rank: number;
  LocalizedName: string;
  EnglishName: string;
  PrimaryPostalCode: string;

  Region: {
    ID: string;
    LocalizedName: string;
    EnglishName: string;
  };

  Country: {
    ID: string;
    LocalizedName: string;
    EnglishName: string;
  };

  AdministrativeArea: {
    ID: string;
    LocalizedName: string;
    EnglishName: string;
    Level: number | null;
    LocalizedType: string;
    EnglishType: string;
    CountryID: string;
  };

  TimeZone: {
    Code: string;
    Name: string;
    GmtOffset: number;
    IsDaylightSaving: boolean;
    NextOffsetChange: string | null; // ISO date string
  };

  GeoPosition: {
    Latitude: number;
    Longitude: number;
    Elevation: {
      Metric: {
        Value: number | null;
        Unit: string;
        UnitType: number;
      };
      Imperial: {
        Value: number | null;
        Unit: string;
        UnitType: number;
      };
    };
  };

  IsAlias: boolean;

  ParentCity?: {
    Key: string;
    LocalizedName: string;
    EnglishName: string;
  };

  SupplementalAdminAreas?: Array<{
    Level: number | null;
    LocalizedName: string;
    EnglishName: string;
  }>;

  DataSets: string[];

  Details: {
    Key: string;
    StationCode: string;
    StationGmtOffset: number | null;
    BandMap: string;
    Climo: string;
    LocalRadar: string;
    MediaRegion: string;
    Metar: string;
    NXMetro: string;
    NXState: string;
    Population: number | null;
    PrimaryWarningCountyCode: string;
    PrimaryWarningZoneCode: string;
    Satellite: string;
    Synoptic: string;
    MarineStation: string;
    MarineStationGMTOffset: number | null;
    VideoCode: string;
    PartnerID: number | null;

    DMA?: {
      ID: string;
      EnglishName: string;
    };

    Sources?: Array<{
      DataType: string;
      Source: string;
      SourceId: number;
    }>;

    CanonicalPostalCode: string;
    CanonicalLocationKey: string;
    LocationStem: string;
  };
}
