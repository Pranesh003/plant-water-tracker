package com.plantcare.service.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import com.plantcare.service.service.NotificationService;

@Configuration
@EnableScheduling
public class NotificationScheduler {

    private final NotificationService notificationService;

    public NotificationScheduler(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // Daily Cron Job at 8:00 AM IST every morning
    @Scheduled(cron = "0 0 8 * * ?", zone = "Asia/Kolkata")
    public void runDailyMorning8AmReminders() {
        System.out.println("⏰ [8:00 AM IST Cron] Running daily automated plant watering reminder job...");
        notificationService.triggerDailyCronJob();
    }
}
