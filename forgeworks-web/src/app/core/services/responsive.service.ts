import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})

export class ResponsiveService {
  private breakpointObserver = inject(BreakpointObserver);

  private readonly small = '(max-width: 600px)';
  private readonly medium = '(min-width: 601px) and (max-width: 1000px)';
  private readonly large = '(min-width: 1001px)';

  private screenWidth = toSignal(
    this.breakpointObserver.observe([this.small, this.medium, this.large])
  );

  // señales booleanas
  isSmall = computed(() => !!this.screenWidth()?.breakpoints[this.small]);
  isMedium = computed(() => !!this.screenWidth()?.breakpoints[this.medium]);
  isLarge = computed(() => !!this.screenWidth()?.breakpoints[this.large]);

  // alias descriptivos
  isMobile = this.isSmall;
  isTablet = this.isMedium;
  isDesktop = this.isLarge;

  smallWidth = this.isSmall;
  mediumWidth = this.isMedium;
  largeWidth = this.isLarge;
}