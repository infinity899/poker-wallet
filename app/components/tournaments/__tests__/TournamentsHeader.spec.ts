import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TournamentsHeader from '../TournamentsHeader.vue';

const stubs = { NuxtLink: { template: '<a><slot /></a>' } };

describe('tournamentsHeader', () => {
  it('shows only the tournament count when there are no re-entries', () => {
    const wrapper = mount(TournamentsHeader, { props: { count: 17, totalEntries: 17 }, global: { stubs } });
    const text = wrapper.text().replace(/\s+/g, ' ');
    expect(text).toContain('17 tournaments');
    expect(text).not.toContain('entries');
  });

  it('shows the total entries when re-entries push it above the count', () => {
    const wrapper = mount(TournamentsHeader, { props: { count: 17, totalEntries: 21 }, global: { stubs } });
    const text = wrapper.text().replace(/\s+/g, ' ');
    expect(text).toContain('17 tournaments');
    expect(text).toContain('21 entries');
  });

  it('uses the singular label for a single tournament', () => {
    const wrapper = mount(TournamentsHeader, { props: { count: 1 }, global: { stubs } });
    expect(wrapper.text()).toContain('1 tournament');
    expect(wrapper.text()).not.toContain('1 tournaments');
  });
});
