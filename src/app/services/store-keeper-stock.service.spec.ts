import { TestBed } from '@angular/core/testing';

import { StoreKeeperStockService } from './store-keeper-stock.service';

describe('StoreKeeperStockService', () => {
  let service: StoreKeeperStockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StoreKeeperStockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
