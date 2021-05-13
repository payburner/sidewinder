package com.github.huksley.camunda;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class UniqueKeys {

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @EventListener(ApplicationReadyEvent.class)
  public void doSomethingAfterStartup() {
    try {
      jdbcTemplate.execute(
          "alter table ACT_RU_EXECUTION add constraint ACT_UNIQ_RU_BUS_KEY UNIQUE (PROC_DEF_ID_, BUSINESS_KEY_)");
    } catch (Exception e) {

    }
    try {
      jdbcTemplate.execute(
          "alter table ACT_HI_PROCINST add constraint ACT_UNIQ_HI_BUS_KEY UNIQUE (PROC_DEF_ID_, BUSINESS_KEY_)");
    } catch (Exception e) {

    }
  }
}
